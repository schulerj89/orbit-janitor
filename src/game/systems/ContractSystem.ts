import {
  CONTRACT_DEFINITIONS,
  formatContractReward,
  type ContractDefinition,
  type ContractEvaluationContext,
  type ContractId,
  type ContractProgress,
  type ContractReward
} from './ContractDefinitions';

export interface ContractSnapshotItem {
  id: ContractId;
  name: string;
  description: string;
  rewardText: string;
  progress: ContractProgress;
  isCompleted: boolean;
}

export interface ContractSnapshot {
  contracts: ContractSnapshotItem[];
  completedIds: ContractId[];
  completedCount: number;
  totalCount: number;
}

export interface ContractCompletion {
  id: ContractId;
  name: string;
  reward: ContractReward;
}

const STORAGE_KEY = 'orbit-janitor.contracts';

export class ContractSystem {
  private readonly completedIds = readCompletedIds();

  evaluateRun(context: ContractEvaluationContext): ContractCompletion[] {
    const completions: ContractCompletion[] = [];

    for (const contract of CONTRACT_DEFINITIONS) {
      if (this.completedIds.has(contract.id)) {
        continue;
      }

      const progress = contract.getProgress(context);

      if (!progress.isComplete) {
        continue;
      }

      this.completedIds.add(contract.id);
      completions.push({
        id: contract.id,
        name: contract.name,
        reward: contract.reward
      });
    }

    if (completions.length > 0) {
      writeCompletedIds(this.completedIds);
    }

    return completions;
  }

  getSnapshot(context: ContractEvaluationContext): ContractSnapshot {
    return {
      contracts: CONTRACT_DEFINITIONS.map((contract) =>
        this.createSnapshotItem(contract, context)
      ),
      completedIds: [...this.completedIds],
      completedCount: this.completedIds.size,
      totalCount: CONTRACT_DEFINITIONS.length
    };
  }

  private createSnapshotItem(
    contract: ContractDefinition,
    context: ContractEvaluationContext
  ): ContractSnapshotItem {
    return {
      id: contract.id,
      name: contract.name,
      description: contract.description,
      rewardText: formatContractReward(contract.reward),
      progress: contract.getProgress(context),
      isCompleted: this.completedIds.has(contract.id)
    };
  }
}

function readCompletedIds(): Set<ContractId> {
  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);

    if (storedValue === null) {
      return new Set();
    }

    const parsedValue = JSON.parse(storedValue) as unknown;

    if (!Array.isArray(parsedValue)) {
      return new Set();
    }

    return new Set(
      parsedValue.filter(
        (contractId): contractId is ContractId =>
          typeof contractId === 'string' &&
          CONTRACT_DEFINITIONS.some((contract) => contract.id === contractId)
      )
    );
  } catch {
    return new Set();
  }
}

function writeCompletedIds(completedIds: Set<ContractId>): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...completedIds]));
  } catch {
    // Contract persistence should not block play when storage is unavailable.
  }
}
