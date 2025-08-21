// Placeholder for User model
// In a real application, this would be a database model (e.g., Mongoose, Sequelize)
class User {
  constructor(id, username, password) {
    this.id = id;
    this.username = username;
    this.password = password; // In a real app, this should be hashed
  }
}

export default User;
