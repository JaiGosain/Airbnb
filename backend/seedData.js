const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Property = require('./models/Property');

const sampleUsers = [
  {
    name: 'John Smith',
    email: 'john@example.com',
    password: 'password123',
    isHost: true,
    avatar: ''
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    password: 'password123',
    isHost: true,
    avatar: ''
  },
  {
    name: 'Mike Wilson',
    email: 'mike@example.com',
    password: 'password123',
    isHost: true,
    avatar: ''
  }
];

const sampleProperties = [
  {
    title: 'Beautiful Beach House in Miami',
    description: 'Stunning beachfront property with panoramic ocean views. Perfect for a relaxing getaway with modern amenities and direct beach access.',
    address: {
      street: '123 Ocean Drive',
      city: 'Miami',
      state: 'Florida',
      zipCode: '33139',
      country: 'USA'
    },
    location: {
      type: 'Point',
      coordinates: [-80.1918, 25.7617]
    },
    price: 250,
    propertyType: 'house',
    roomType: 'entire',
    maxGuests: 6,
    bedrooms: 3,
    bathrooms: 2,
    images: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800'
    ],
    amenities: ['WiFi', 'Pool', 'Beach Access', 'Parking', 'Kitchen', 'Air Conditioning']
  },
  {
    title: 'Cozy Apartment in New York',
    description: 'Modern apartment in the heart of Manhattan. Close to all major attractions, restaurants, and shopping areas.',
    address: {
      street: '456 Broadway',
      city: 'New York',
      state: 'New York',
      zipCode: '10013',
      country: 'USA'
    },
    location: {
      type: 'Point',
      coordinates: [-74.0060, 40.7128]
    },
    price: 180,
    propertyType: 'apartment',
    roomType: 'entire',
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 1,
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'
    ],
    amenities: ['WiFi', 'Kitchen', 'Air Conditioning', 'Elevator', 'Gym']
  },
  {
    title: 'Mountain Cabin in Colorado',
    description: 'Rustic cabin surrounded by beautiful mountain scenery. Perfect for hiking, skiing, and outdoor adventures.',
    address: {
      street: '789 Mountain View Road',
      city: 'Aspen',
      state: 'Colorado',
      zipCode: '81611',
      country: 'USA'
    },
    location: {
      type: 'Point',
      coordinates: [-106.8231, 39.1911]
    },
    price: 320,
    propertyType: 'house',
    roomType: 'entire',
    maxGuests: 8,
    bedrooms: 4,
    bathrooms: 3,
    images: [
      'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'
    ],
    amenities: ['WiFi', 'Fireplace', 'Hot Tub', 'Parking', 'Kitchen', 'Mountain View']
  },
  {
    title: 'Luxury Villa in California',
    description: 'Stunning villa with private pool and garden. Located in a quiet neighborhood with easy access to beaches and downtown.',
    address: {
      street: '321 Sunset Boulevard',
      city: 'Los Angeles',
      state: 'California',
      zipCode: '90028',
      country: 'USA'
    },
    location: {
      type: 'Point',
      coordinates: [-118.2437, 34.0522]
    },
    price: 450,
    propertyType: 'villa',
    roomType: 'entire',
    maxGuests: 10,
    bedrooms: 5,
    bathrooms: 4,
    images: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'
    ],
    amenities: ['WiFi', 'Pool', 'Garden', 'Parking', 'Kitchen', 'Air Conditioning', 'Hot Tub']
  },
  {
    title: 'Historic Brownstone in Boston',
    description: 'Charming historic brownstone in the heart of Boston. Walking distance to Freedom Trail and Boston Common.',
    address: {
      street: '654 Beacon Street',
      city: 'Boston',
      state: 'Massachusetts',
      zipCode: '02215',
      country: 'USA'
    },
    location: {
      type: 'Point',
      coordinates: [-71.0589, 42.3601]
    },
    price: 200,
    propertyType: 'house',
    roomType: 'entire',
    maxGuests: 6,
    bedrooms: 3,
    bathrooms: 2,
    images: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800'
    ],
    amenities: ['WiFi', 'Kitchen', 'Parking', 'Historic Building', 'Walking Distance to Attractions']
  },
  {
    title: 'Modern Studio in Seattle',
    description: 'Contemporary studio apartment with city views. Perfect for business travelers or couples exploring Seattle.',
    address: {
      street: '987 Pine Street',
      city: 'Seattle',
      state: 'Washington',
      zipCode: '98101',
      country: 'USA'
    },
    location: {
      type: 'Point',
      coordinates: [-122.3321, 47.6062]
    },
    price: 120,
    propertyType: 'studio',
    roomType: 'entire',
    maxGuests: 2,
    bedrooms: 0,
    bathrooms: 1,
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'
    ],
    amenities: ['WiFi', 'Kitchen', 'Air Conditioning', 'City View', 'Elevator']
  },
  {
    title: 'Downtown Loft in Chicago',
    description: 'Spacious industrial loft with high ceilings and modern design. Located in the heart of downtown Chicago with easy access to restaurants and nightlife.',
    address: {
      street: '555 Michigan Avenue',
      city: 'Chicago',
      state: 'Illinois',
      zipCode: '60611',
      country: 'USA'
    },
    location: {
      type: 'Point',
      coordinates: [-87.6298, 41.8781]
    },
    price: 220,
    propertyType: 'loft',
    roomType: 'entire',
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 2,
    images: [
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800'
    ],
    amenities: ['WiFi', 'Kitchen', 'Air Conditioning', 'City View', 'Washer/Dryer', 'Gym']
  },
  {
    title: 'Beachfront Condo in San Diego',
    description: 'Beautiful oceanfront condo with stunning sunset views. Steps away from the beach and local restaurants.',
    address: {
      street: '789 Pacific Beach Drive',
      city: 'San Diego',
      state: 'California',
      zipCode: '92109',
      country: 'USA'
    },
    location: {
      type: 'Point',
      coordinates: [-117.1611, 32.7157]
    },
    price: 280,
    propertyType: 'condo',
    roomType: 'entire',
    maxGuests: 6,
    bedrooms: 3,
    bathrooms: 2,
    images: [
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'
    ],
    amenities: ['WiFi', 'Pool', 'Beach Access', 'Parking', 'Kitchen', 'Ocean View', 'Balcony']
  },
  {
    title: 'Cozy Private Room in Austin',
    description: 'Comfortable private room in a friendly neighborhood. Perfect for solo travelers or couples visiting Austin.',
    address: {
      street: '234 South Lamar',
      city: 'Austin',
      state: 'Texas',
      zipCode: '78704',
      country: 'USA'
    },
    location: {
      type: 'Point',
      coordinates: [-97.7431, 30.2672]
    },
    price: 95,
    propertyType: 'apartment',
    roomType: 'private',
    maxGuests: 2,
    bedrooms: 1,
    bathrooms: 1,
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'
    ],
    amenities: ['WiFi', 'Kitchen Access', 'Air Conditioning', 'Parking']
  },
  {
    title: 'Luxury Penthouse in Las Vegas',
    description: 'Stunning penthouse with panoramic city views. Located on the Strip with access to world-class entertainment and dining.',
    address: {
      street: '123 Las Vegas Boulevard',
      city: 'Las Vegas',
      state: 'Nevada',
      zipCode: '89101',
      country: 'USA'
    },
    location: {
      type: 'Point',
      coordinates: [-115.1728, 36.1147]
    },
    price: 550,
    propertyType: 'apartment',
    roomType: 'entire',
    maxGuests: 8,
    bedrooms: 4,
    bathrooms: 3,
    images: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'
    ],
    amenities: ['WiFi', 'Pool', 'Gym', 'Parking', 'Kitchen', 'City View', 'Concierge', 'Hot Tub']
  },
  {
    title: 'Riverside House in Portland',
    description: 'Charming house by the river with beautiful garden. Peaceful location yet close to downtown Portland.',
    address: {
      street: '456 River Road',
      city: 'Portland',
      state: 'Oregon',
      zipCode: '97201',
      country: 'USA'
    },
    location: {
      type: 'Point',
      coordinates: [-122.6784, 45.5152]
    },
    price: 175,
    propertyType: 'house',
    roomType: 'entire',
    maxGuests: 5,
    bedrooms: 3,
    bathrooms: 2,
    images: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800'
    ],
    amenities: ['WiFi', 'Garden', 'Parking', 'Kitchen', 'Fireplace', 'River View']
  },
  {
    title: 'Historic Apartment in Philadelphia',
    description: 'Beautifully restored historic apartment in Old City. Walking distance to Independence Hall and Liberty Bell.',
    address: {
      street: '789 Market Street',
      city: 'Philadelphia',
      state: 'Pennsylvania',
      zipCode: '19106',
      country: 'USA'
    },
    location: {
      type: 'Point',
      coordinates: [-75.1652, 39.9526]
    },
    price: 160,
    propertyType: 'apartment',
    roomType: 'entire',
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 1,
    images: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800'
    ],
    amenities: ['WiFi', 'Kitchen', 'Air Conditioning', 'Historic Building', 'Walking Distance to Attractions']
  },
  {
    title: 'Mountain View Villa in Denver',
    description: 'Luxurious villa with breathtaking mountain views. Modern amenities in a serene mountain setting.',
    address: {
      street: '321 Mountain View Lane',
      city: 'Denver',
      state: 'Colorado',
      zipCode: '80202',
      country: 'USA'
    },
    location: {
      type: 'Point',
      coordinates: [-104.9903, 39.7392]
    },
    price: 380,
    propertyType: 'villa',
    roomType: 'entire',
    maxGuests: 12,
    bedrooms: 6,
    bathrooms: 4,
    images: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
      'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800'
    ],
    amenities: ['WiFi', 'Pool', 'Hot Tub', 'Parking', 'Kitchen', 'Mountain View', 'Fireplace', 'Gym']
  },
  {
    title: 'Shared Room in Brooklyn',
    description: 'Comfortable shared room in trendy Brooklyn neighborhood. Great for budget travelers and backpackers.',
    address: {
      street: '567 Bedford Avenue',
      city: 'Brooklyn',
      state: 'New York',
      zipCode: '11211',
      country: 'USA'
    },
    location: {
      type: 'Point',
      coordinates: [-73.9442, 40.6782]
    },
    price: 65,
    propertyType: 'apartment',
    roomType: 'shared',
    maxGuests: 1,
    bedrooms: 1,
    bathrooms: 1,
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'
    ],
    amenities: ['WiFi', 'Kitchen Access', 'Air Conditioning', 'Public Transport Nearby']
  },
  {
    title: 'Beach House in Key West',
    description: 'Stunning beach house with direct beach access. Perfect for a tropical getaway with family or friends.',
    address: {
      street: '890 Duval Street',
      city: 'Key West',
      state: 'Florida',
      zipCode: '33040',
      country: 'USA'
    },
    location: {
      type: 'Point',
      coordinates: [-81.7816, 24.5551]
    },
    price: 420,
    propertyType: 'house',
    roomType: 'entire',
    maxGuests: 8,
    bedrooms: 4,
    bathrooms: 3,
    images: [
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'
    ],
    amenities: ['WiFi', 'Beach Access', 'Pool', 'Parking', 'Kitchen', 'Ocean View', 'Boat Dock']
  },
  {
    title: 'Modern Condo in Nashville',
    description: 'Stylish condo in the heart of Music City. Close to live music venues, restaurants, and nightlife.',
    address: {
      street: '234 Broadway',
      city: 'Nashville',
      state: 'Tennessee',
      zipCode: '37203',
      country: 'USA'
    },
    location: {
      type: 'Point',
      coordinates: [-86.7816, 36.1627]
    },
    price: 195,
    propertyType: 'condo',
    roomType: 'entire',
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 2,
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'
    ],
    amenities: ['WiFi', 'Kitchen', 'Air Conditioning', 'City View', 'Gym', 'Parking']
  },
  {
    title: 'Lakeside Cabin in Minnesota',
    description: 'Peaceful cabin on a beautiful lake. Perfect for fishing, kayaking, and enjoying nature.',
    address: {
      street: '123 Lakeview Drive',
      city: 'Duluth',
      state: 'Minnesota',
      zipCode: '55802',
      country: 'USA'
    },
    location: {
      type: 'Point',
      coordinates: [-92.1005, 46.7867]
    },
    price: 150,
    propertyType: 'house',
    roomType: 'entire',
    maxGuests: 6,
    bedrooms: 3,
    bathrooms: 2,
    images: [
      'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'
    ],
    amenities: ['WiFi', 'Fireplace', 'Parking', 'Kitchen', 'Lake View', 'Boat Access', 'Fishing']
  },
  {
    title: 'Urban Loft in Atlanta',
    description: 'Modern loft in vibrant Midtown Atlanta. Walking distance to restaurants, shops, and entertainment.',
    address: {
      street: '456 Peachtree Street',
      city: 'Atlanta',
      state: 'Georgia',
      zipCode: '30309',
      country: 'USA'
    },
    location: {
      type: 'Point',
      coordinates: [-84.3880, 33.7490]
    },
    price: 180,
    propertyType: 'loft',
    roomType: 'entire',
    maxGuests: 3,
    bedrooms: 1,
    bathrooms: 1,
    images: [
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800'
    ],
    amenities: ['WiFi', 'Kitchen', 'Air Conditioning', 'City View', 'Washer/Dryer', 'Gym']
  }
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/airbnb-clone');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Property.deleteMany({});
    console.log('Cleared existing data');

    // Create users
    const users = [];
    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
      users.push(user);
      console.log(`Created user: ${user.name}`);
    }

    // Create properties
    for (let i = 0; i < sampleProperties.length; i++) {
      const propertyData = {
        ...sampleProperties[i],
        host: users[i % users.length]._id
      };
      const property = new Property(propertyData);
      await property.save();
      console.log(`Created property: ${property.title}`);
    }

    console.log('Database seeded successfully!');
    console.log('\nSample users created:');
    console.log('Email: john@example.com, Password: password123');
    console.log('Email: sarah@example.com, Password: password123');
    console.log('Email: mike@example.com, Password: password123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();



