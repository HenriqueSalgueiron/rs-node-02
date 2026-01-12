// arquivos da pasta @types são usados para declarar ou sobrescrever tipos de bibliotecas externas
import { Knex } from "knex";

declare module "knex/types/tables" {
  export interface Tables {
    transactions: {
      id: string;
      title: string;
      amount: number;
      created_at: string;
      session_id?: string;
    };
  }
}
