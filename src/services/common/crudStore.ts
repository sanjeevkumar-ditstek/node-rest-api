import { Model, Document, LeanDocument } from 'mongoose';
import logger from '../../utils/logger/winston';

export default class CrudStore {
  private model: Model<Document>;

  constructor(model: Model<Document>) {
    this.model = model; // The model to operate on (like UserModel, ProductModel, etc.)
  }

  /**
   * Creates a new document in the collection.
   *
   * @param data - The data to be saved in the database.
   * @returns The created document or an error if the operation fails.
   */
  public async create(data: any): Promise<Document> {
    try {
      const document = await this.model.create(data);
      return document;
    } catch (e) {
      logger.error(e);
      throw new Error('Operation unsuccessful during create');
    }
  }

  /**
   * Retrieves a document by its ID.
   *
   * @param id - The ID of the document to be retrieved.
   * @returns The document or an error if the operation fails.
   */
  public async getSingle(key: string, value: any): Promise<LeanDocument<Document> | null> {
    try {
      const query = { [key]: value }; // Dynamically build the query using the key-value pair
      console.log('query: ', query);
      const document = await this.model.findOne(query, {password: 1, email: 1}).lean(); // Using lean() to get plain JS object
      console.log('document: ', document);
      return document;
    } catch (e) {
      logger.error(e);
      throw new Error('Operation unsuccessful during getSingle');
    }
  }

  /**
   * Retrieves all documents with optional pagination.
   *
   * @param query - The query object (filters, etc.).
   * @param pagination - The pagination options (page, limit).
   * @returns A list of documents with pagination metadata.
   */
  public async getAll(query: object = {}, pagination: { page: number; limit: number } = { page: 1, limit: 10 }): Promise<{
    list: Document[];
    metadata: {
      totalCount: number;
      totalPages: number;
    };
  }> {
    try {
      const { page, limit } = pagination;
      const totalCount = await this.model.countDocuments(query);
      const totalPages = Math.ceil(totalCount / limit);
      const documents = await this.model
        .find(query)
        .skip((page - 1) * limit)
        .limit(limit);
      return {
        list: documents,
        metadata: {
          totalCount,
          totalPages,
        },
      };
    } catch (e) {
      logger.error(e);
      throw new Error('Operation unsuccessful during getAll');
    }
  }

  /**
   * Updates a document by its ID with the provided data.
   *
   * @param id - The ID of the document to be updated.
   * @param data - The data to update the document with.
   * @returns The updated document or an error if the operation fails.
   */
  public async update(id: string, data: object): Promise<Document | null> {
    try {
      const updatedDocument = await this.model.findByIdAndUpdate(id, data, { new: true });
      return updatedDocument;
    } catch (e) {
      logger.error(e);
      throw new Error('Operation unsuccessful during update');
    }
  }

  /**
   * Deletes a document by its ID by marking it as deleted (soft delete).
   *
   * @param id - The ID of the document to be deleted.
   * @returns The updated document with the deleted status or an error if the operation fails.
   */
  public async delete(id: string): Promise<Document | null> {
    try {
      const deletedDocument = await this.model.findByIdAndUpdate(id, { status: 2 }, { new: true });  // Assuming `status: 2` is the deleted state
      return deletedDocument;
    } catch (e) {
      logger.error(e);
      throw new Error('Operation unsuccessful during delete');
    }
  }
}
