import { applyMethodDecorators } from '../src/decorators';

type Fn = (...args: unknown[]) => unknown;

describe('applyMethodDecorators', () => {
  it('applies the decorator closest to the method first, like @decorator syntax', () => {
    const calls: string[] = [];
    const tag = (label: string) => (target: Fn, _ctx: ClassMethodDecoratorContext) =>
      function (this: unknown, ...args: unknown[]) {
        calls.push(label);
        return target.apply(this, args);
      };
    class Target {
      run(): string {
        calls.push('method');
        return 'done';
      }
    }
    applyMethodDecorators(Target, 'run', tag('outer'), tag('inner'));
    expect(new Target().run()).toBe('done');
    expect(calls).toEqual(['outer', 'inner', 'method']);
  });

  it('passes the method name to the decorator context', () => {
    let seen = '';
    const capture = (target: Fn, ctx: ClassMethodDecoratorContext) => {
      seen = String(ctx.name);
      return target;
    };
    class Target {
      login(): void {}
    }
    applyMethodDecorators(Target, 'login', capture);
    expect(seen).toBe('login');
  });

  it('rejects a name that is not a method', () => {
    class Target {}
    expect(() => applyMethodDecorators(Target, 'missing')).toThrow(TypeError);
  });
});
