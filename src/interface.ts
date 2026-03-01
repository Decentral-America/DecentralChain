export type TLong = string | number;

export interface IWithApplicationStatus {
  applicationStatus?: 'succeed' | 'script_execution_failed';
}
