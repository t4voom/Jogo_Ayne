/**
 * Wrapper mínimo e tipado sobre o IndexedDB (sem dependências).
 * Tudo devolve Promises; erros são `IdbError` com o contexto da operação.
 */

export class IdbError extends Error {
  override readonly name = 'IdbError';
}

export type UpgradeFn = (db: IDBDatabase, oldVersion: number, tx: IDBTransaction) => void;

export function promisify<T>(request: IDBRequest<T>, context: string): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(new IdbError(`${context}: ${request.error?.message ?? 'erro desconhecido'}`));
    };
  });
}

function transactionDone(tx: IDBTransaction, context: string): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      resolve();
    };
    tx.onerror = () => {
      reject(new IdbError(`${context}: ${tx.error?.message ?? 'erro na transação'}`));
    };
    tx.onabort = () => {
      reject(
        new IdbError(`${context}: transação abortada (${tx.error?.message ?? 'sem detalhe'})`),
      );
    };
  });
}

function keyLabel(key: IDBValidKey): string {
  return typeof key === 'string' || typeof key === 'number' ? String(key) : JSON.stringify(key);
}

export class Database {
  private constructor(private db: IDBDatabase) {}

  static open(
    factory: IDBFactory,
    name: string,
    version: number,
    upgrade: UpgradeFn,
  ): Promise<Database> {
    return new Promise((resolve, reject) => {
      let request: IDBOpenDBRequest;
      try {
        request = factory.open(name, version);
      } catch (error) {
        reject(new IdbError('Não foi possível abrir o banco local', { cause: error }));
        return;
      }
      request.onupgradeneeded = (event) => {
        const tx = request.transaction;
        if (!tx) return;
        upgrade(request.result, event.oldVersion, tx);
      };
      request.onblocked = () => {
        reject(new IdbError('Banco local bloqueado por outra aba aberta'));
      };
      request.onerror = () => {
        reject(new IdbError(`Falha ao abrir o banco: ${request.error?.message ?? '?'}`));
      };
      request.onsuccess = () => {
        const db = request.result;
        // Outra aba com versão nova do app quer atualizar o banco: liberamos.
        db.onversionchange = () => {
          db.close();
        };
        resolve(new Database(db));
      };
    });
  }

  close(): void {
    this.db.close();
  }

  async get(store: string, key: IDBValidKey): Promise<unknown> {
    const tx = this.db.transaction(store, 'readonly');
    return promisify<unknown>(tx.objectStore(store).get(key), `ler ${store}/${keyLabel(key)}`);
  }

  async getAll(store: string): Promise<unknown[]> {
    const tx = this.db.transaction(store, 'readonly');
    return promisify<unknown[]>(tx.objectStore(store).getAll(), `ler ${store}`);
  }

  async getAllKeys(store: string): Promise<IDBValidKey[]> {
    const tx = this.db.transaction(store, 'readonly');
    return promisify(tx.objectStore(store).getAllKeys(), `chaves de ${store}`);
  }

  async put(store: string, value: unknown, key?: IDBValidKey): Promise<void> {
    const tx = this.db.transaction(store, 'readwrite');
    const os = tx.objectStore(store);
    if (key === undefined) os.put(value);
    else os.put(value, key);
    await transactionDone(tx, `gravar em ${store}`);
  }

  async add(store: string, value: unknown): Promise<IDBValidKey> {
    const tx = this.db.transaction(store, 'readwrite');
    const key = promisify(tx.objectStore(store).add(value), `adicionar em ${store}`);
    await transactionDone(tx, `adicionar em ${store}`);
    return key;
  }

  async delete(store: string, key: IDBValidKey): Promise<void> {
    const tx = this.db.transaction(store, 'readwrite');
    tx.objectStore(store).delete(key);
    await transactionDone(tx, `apagar ${store}/${keyLabel(key)}`);
  }

  async clear(store: string): Promise<void> {
    const tx = this.db.transaction(store, 'readwrite');
    tx.objectStore(store).clear();
    await transactionDone(tx, `limpar ${store}`);
  }

  /** Várias gravações atômicas (tudo ou nada) em uma transação. */
  async batch(
    stores: string[],
    work: (get: (store: string) => IDBObjectStore) => void,
  ): Promise<void> {
    const tx = this.db.transaction(stores, 'readwrite');
    work((s) => tx.objectStore(s));
    await transactionDone(tx, `lote em ${stores.join(',')}`);
  }
}
