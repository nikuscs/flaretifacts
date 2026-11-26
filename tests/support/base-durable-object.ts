export class DurableObject<E> {
  protected ctx: DurableObjectState;
  protected env: E;

  constructor(ctx: DurableObjectState, env: E) {
    this.ctx = ctx;
    this.env = env;
  }
}
