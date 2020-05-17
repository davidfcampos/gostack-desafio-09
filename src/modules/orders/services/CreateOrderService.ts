import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

interface IProductSave {
  product_id: string;
  price: number;
  quantity: number;
}

@injectable()
class CreateProductService {
  constructor(
    @inject('OrdersRepository') private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('customer not found');
    }

    const orderProducts: IProductSave[] = [];

    products.forEach(async product => {
      const findProduct = await this.productsRepository.findAllById([
        { id: product.id },
      ]);

      if (findProduct.length) {
        throw new AppError('one or more reported products were not found');
      }

      if (findProduct[0].quantity < product.quantity) {
        throw new AppError(
          `quantity for product ${findProduct[0].name} not available`,
        );
      }

      orderProducts.push({
        product_id: findProduct[0].id,
        price: findProduct[0].price,
        quantity: findProduct[0].quantity,
      });
    });

    const order = await this.ordersRepository.create({
      customer,
      products: orderProducts,
    });

    return order;
  }
}

export default CreateProductService;
