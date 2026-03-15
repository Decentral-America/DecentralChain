import { type Money } from '@decentralchain/data-entities';
import { type IHash } from '../interface';

export class MoneyHash {
  private _storage: IHash<Money> = Object.create(null);

  constructor(list?: Array<Money>) {
    if (list) {
      list.forEach(this.add, this);
    }
  }

  public add(money: Money) {
    if (this._storage[money.asset.id]) {
      this._storage[money.asset.id] = this._storage[money.asset.id].add(money);
    } else {
      this._storage[money.asset.id] = money;
    }
  }

  public get(id: string) {
    return this._storage[id];
  }

  public toHash(): IHash<Money> {
    return this._storage;
  }
}
