import { getRepository, Repository } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import AppError from '@shared/errors/AppError';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity,
    });
    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const product = await this.ormRepository.findOne({
      where: {
        name,
      },
    });
    return product;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const productList = await this.ormRepository.findByIds(products);
    return productList;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const idProducts = products.map(prod => {
      return { id: prod.id };
    });

    const productList = await this.ormRepository.findByIds(idProducts);

    const productListToSave = productList.map(savedProduct => {
      const requestProduct = products.find(prod => prod.id === savedProduct.id);

      if (!requestProduct) {
        throw new AppError('Product not found!');
      }

      return {
        ...savedProduct,
        quantity: savedProduct.quantity - requestProduct.quantity,
      };
    });

    const savedProducts = await this.ormRepository.save(productListToSave);

    return savedProducts;
  }
}

export default ProductsRepository;
