import { kitchenRepository } from '../repository'
import type { CreateKitchenTicketInput } from '../../schemas'

export async function createKitchenTicketAction(input: CreateKitchenTicketInput) {
  return await kitchenRepository.createTicket(input)
}
