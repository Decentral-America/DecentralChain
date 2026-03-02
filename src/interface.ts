export type TLong = string | number;

export interface IWithApplicationStatus {
  applicationStatus?: 'succeeded' | 'script_execution_failed';
}
