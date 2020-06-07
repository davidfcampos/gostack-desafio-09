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

@injectable()
class CreateProductService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer not found!');
    }

    const idProducts = products.map(prod => {
      return { id: prod.id };
    });

    const savedProducts = await this.productsRepository.findAllById(idProducts);

    if (idProducts.length !== savedProducts.length) {
      throw new AppError('Product not found!');
    }

    const productsToSave = savedProducts.map(savedProduct => {
      const requestProduct = products.find(prod => prod.id === savedProduct.id);

      if (!requestProduct) {
        throw new AppError('Product not found!');
      }

      if (requestProduct.quantity > savedProduct.quantity) {
        throw new AppError('Insuficient amount!');
      }

      return {
        product_id: savedProduct.id,
        price: savedProduct.price,
        quantity: requestProduct.quantity,
      };
    });

    const order = await this.ordersRepository.create({
      customer,
      products: productsToSave,
    });

    await this.productsRepository.updateQuantity(products);

    return order;
  }
}

export default CreateProductService;
