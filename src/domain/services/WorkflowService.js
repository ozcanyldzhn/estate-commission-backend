// Basit state machine: yalnızca ardışık geçişe izin verir.
const ORDER = ['AGREEMENT', 'EARNEST', 'TITLE_DEED', 'COMPLETED'];

export class WorkflowService {
  canTransition(current, next) {
    const i1 = ORDER.indexOf(current);
    const i2 = ORDER.indexOf(next);
    return i2 === i1 + 1;
  }
}
