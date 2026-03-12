# Synchronization Odoo

Note

Access to data via the external API is only available on Custom Odoo pricing plans. Access to the external API is not available on One App Free or Standard plans. For more information visit the Odoo pricing page or reach out to your Customer Success Manager.

## API documentation

[Odoo API Documentation](https://www.odoo.com/documentation/18.0/developer/reference/external_api.html)

## Synchronization by web hook

### Entities

Entities to be synchronized:

Customer

- res.partner

Products

- product.product

Sales

- sales.order
- sales.order.line

Invoices

- account.move

Payments

- account.payment

## Point of sale

Create order at same time
Dando clic al producto aumenta la cantidad
La cantidad en numeros grandes en lugar de un boton para incrementar
El teclado numerico aparece al seleccionar un producto de la lsita
El producto muestra la canitdad y tallas
Cuando le doy pago navega a la pagina de pago. Con opciones de efectivo tarjeta o cuenta del cliente
