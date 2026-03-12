import { kitchenRepository } from '../repository'
import type {
  UpdateTicketStatusInput,
  UpdateItemStatusInput,
} from '../../schemas'

export async function updateTicketStatusAction(input: UpdateTicketStatusInput) {
  await kitchenRepository.updateTicketStatus(input.ticketId, input.status)
  return { success: true }
}

export async function updateItemStatusAction(input: UpdateItemStatusInput) {
  await kitchenRepository.updateItemStatus(input.itemId, input.status)
  return { success: true }
}
