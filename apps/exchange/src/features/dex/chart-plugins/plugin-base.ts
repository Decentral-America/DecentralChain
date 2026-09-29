import {
  type DataChangedScope,
  type IChartApi,
  type ISeriesApi,
  type ISeriesPrimitive,
  type SeriesAttachedParameter,
  type SeriesOptionsMap,
  type Time,
} from 'lightweight-charts';
import { ensureDefined } from './helpers/assertions';

export abstract class PluginBase implements ISeriesPrimitive<Time> {
  private _chart: IChartApi | undefined = undefined;
  private _series: ISeriesApi<keyof SeriesOptionsMap> | undefined = undefined;

  protected dataUpdated?(scope: DataChangedScope): void;
  protected requestUpdate(): void {
    if (this._requestUpdate) this._requestUpdate();
  }
  private _requestUpdate?: () => void;

  public attached({ chart, series, requestUpdate }: SeriesAttachedParameter<Time>) {
    this._chart = chart;
    this._series = series;
    this._series.subscribeDataChanged(this._fireDataUpdated);
    this._requestUpdate = requestUpdate;
    this.requestUpdate();
  }

  public detached() {
    this._series?.unsubscribeDataChanged(this._fireDataUpdated);
    this._chart = undefined;
    this._series = undefined;
    // v5/strict: `exactOptionalPropertyTypes` forbids assigning undefined to an
    // optional property. Deleting it says the same thing and satisfies the flag.
    delete this._requestUpdate;
  }

  public get chart(): IChartApi {
    return ensureDefined(this._chart);
  }

  public get series(): ISeriesApi<keyof SeriesOptionsMap> {
    return ensureDefined(this._series);
  }

  // This method is a class property to maintain the
  // lexical 'this' scope (due to the use of the arrow function)
  // and to ensure its reference stays the same, so we can unsubscribe later.
  private _fireDataUpdated = (scope: DataChangedScope) => {
    if (this.dataUpdated) {
      this.dataUpdated(scope);
    }
  };
}
