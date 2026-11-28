import { createFakeLinear } from './fakeLinear.ts'
import { contractTeams, linearPortContract } from './linearPortContract.ts'

linearPortContract(() => createFakeLinear(contractTeams))
