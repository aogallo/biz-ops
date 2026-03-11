import { exchangeRateRepository } from '../repository'
import type { SetExchangeRateInput } from '../../schemas'

export async function setExchangeRateAction(input: SetExchangeRateInput) {
  return await exchangeRateRepository.setRate(input)
}
