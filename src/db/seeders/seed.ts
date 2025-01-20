import { MongoClient, ObjectId } from 'mongodb';
import Roles from '../../utils/enum/Roles';
import * as bcrypt from 'bcryptjs';

const mongoUrl = 'mongodb://localhost:27017'; // Change this to your MongoDB connection string
const dbName = 'node-rest-api'; // Change this to your database name

const seedDatabase = async () => {
  const client = new MongoClient(mongoUrl);

  try {
    await client.connect();
    const db = client.db(dbName);

    // Define the modules data
    const modules = [
          {
            _id: new ObjectId(),
            module: 'product',
          },
    ];
    
    // Insert permissions into the permissions collection
    const modulesResult = await db
      .collection('modules')
      .insertMany(modules);
    console.log('Inserted modules:', modulesResult.insertedIds);

    // Define the permissions data
    const permissions = [
      {
        _id: new ObjectId(),
        module: modulesResult.insertedIds[0],
        action: 'create',
      },
      {
        _id: new ObjectId(),
        module: modulesResult.insertedIds[0],
        action: 'read',
      },
      {
        _id: new ObjectId(),
        module: modulesResult.insertedIds[0],
        action: 'update',
      },
      {
        _id: new ObjectId(),
        module: modulesResult.insertedIds[0],
        action: 'delete',
      },
    ];

    // Insert permissions into the permissions collection
    const permissionResult = await db
      .collection('permissions')
      .insertMany(permissions);
    console.log('Inserted permissions:', permissionResult.insertedIds);

    // Define the roles data
    const roles = [
      {
        _id: new ObjectId(),
        role: Roles.SUPER_ADMIN,
        permissions: permissionResult.insertedIds, // All permissions (Create, Read, Update, Delete)
      },
      {
        _id: new ObjectId(),
        role: Roles.ADMIN,
        permissions: [
          permissionResult.insertedIds[1],
          permissionResult.insertedIds[0],
          permissionResult.insertedIds[2],
        ], // Create, Read, Update
      },
      {
        _id: new ObjectId(),
        role: Roles.USER,
        permissions: [permissionResult.insertedIds[0]], // Only Read
      },
    ];

    // Insert roles into the roles collection
    const roleResult = await db.collection('roles').insertMany(roles);
    console.log('Inserted roles:', roleResult.insertedIds);

    // Define the users data, using the ObjectIds from the roles
    const usersData = [
      {
        email: 'superadmin@example.com',
        password: 'superadmin_password', // Plaintext password
        roles: [roleResult.insertedIds[0]], // Reference to super admin role
        permissions: permissionResult.insertedIds,
      },
      {
        email: 'admin@example.com',
        password: ' ', // Plaintext password
        roles: [roleResult.insertedIds[1]], // Reference to admin role
        permissions: [
          permissionResult.insertedIds[1],
          permissionResult.insertedIds[0],
          permissionResult.insertedIds[2],
        ], // Create, Read, Update
      },
      {
        email: 'user@example.com',
        password: 'user_password', // Plaintext password
        roles: [roleResult.insertedIds[2]], // Reference to user role
        permissions: [
          permissionResult.insertedIds[1],
          permissionResult.insertedIds[0],
          permissionResult.insertedIds[2],
        ], // Create, Read, Update
      },
    ];

    // Hash the passwords
    const users = await Promise.all(
      usersData.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, 10); // Hash the password with 10 salt rounds
        return {
          email: user.email,
          password: hashedPassword, // Store hashed password
          roles: user.roles,
        };
      }),
    );

    // Insert users into the users collection
    const userResult = await db.collection('users').insertMany(users);
    console.log('Inserted users:', userResult.insertedIds);

    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await client.close();
  }
};

seedDatabase();
