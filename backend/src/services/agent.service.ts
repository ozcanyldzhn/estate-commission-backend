import { prisma } from '../infra/prisma.js'

export async function getAgentEarnings(agentId: string, from?: string, to?: string) {
  // Tarih filtresi (createdAt varsa onu, yoksa updatedAt/createdAt kullan)
  const dateFilter: any = {}
  if (from) dateFilter.gte = new Date(from)
  if (to)   dateFilter.lte = new Date(to)

  const whereTx: any = {
    stage: 'COMPLETED',
    OR: [{ listingAgentId: agentId }, { sellingAgentId: agentId }]
  }
  if (from || to) {
    // alan adına projene göre uyarlayabilirsin
    whereTx.createdAt = dateFilter
  }

  const txs = await prisma.transaction.findMany({
    where: whereTx,
    select: {
      id: true,
      commissionAmount: true,        // Prisma Decimal olabilir
      listingAgentId: true,
      sellingAgentId: true,
      currency: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  })

  const currency = txs[0]?.currency ?? 'TRY'
  const toMinor = (major: number) => Math.round(major * 100)
  const toMajor = (minor: number) => minor / 100
  const formatCurrency = (major: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(major)

  let totalMinor = 0
  const items = txs.map(t => {
    // Decimal → number (major), sonra minor'a çevirip tamsayıyla hesapla
    const commissionMajor =
      typeof (t as any).commissionAmount === 'number'
        ? (t as any).commissionAmount
        : (typeof (t as any).commissionAmount?.toNumber === 'function'
            ? (t as any).commissionAmount.toNumber()
            : Number((t as any).commissionAmount))

    const commissionMinor = toMinor(commissionMajor)
    const agency = Math.floor(commissionMinor * 0.5)
    const agentPortion = commissionMinor - agency

    let earnedMinor = 0
    let role: 'listing' | 'selling' | 'solo' = 'listing'

    if (t.listingAgentId === t.sellingAgentId && t.listingAgentId === agentId) {
      role = 'solo'
      earnedMinor = agentPortion
    } else if (t.listingAgentId === agentId) {
      role = 'listing'
      earnedMinor = Math.floor(agentPortion / 2)
    } else if (t.sellingAgentId === agentId) {
      role = 'selling'
      earnedMinor = Math.ceil(agentPortion / 2) // kuruş kalırsa yukarı yuvarla
    }

    totalMinor += earnedMinor
    const earnedMajor = toMajor(earnedMinor)
    return { transactionId: t.id, role, earnedMinor, earnedMajor, earnedFormatted: formatCurrency(earnedMajor), createdAt: t.createdAt }
  })

  return {
    agentId,
    period: { from: from ?? null, to: to ?? null },
    currency,
    totalAgentEarningsMinor: totalMinor,
    totalAgentEarningsMajor: toMajor(totalMinor),
    totalAgentEarningsFormatted: formatCurrency(toMajor(totalMinor)),
    byTransaction: items
  }
}
