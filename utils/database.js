const fs = require('fs');
const path = require('path');

class Database {
  constructor(filename) {
    this.filepath = path.join(__dirname, '..', 'data', filename);
  }

  read() {
    try {
      const data = fs.readFileSync(this.filepath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  write(data) {
    try {
      fs.writeFileSync(this.filepath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error('Database write error:', error);
      return false;
    }
  }

  find(query) {
    const data = this.read();
    return data.filter(item => {
      return Object.keys(query).every(key => item[key] === query[key]);
    });
  }

  findOne(query) {
    const results = this.find(query);
    return results.length > 0 ? results[0] : null;
  }

  insert(item) {
    const data = this.read();
    data.push(item);
    this.write(data);
    return item;
  }

  update(query, updates) {
    const data = this.read();
    let updated = false;
    const newData = data.map(item => {
      const matches = Object.keys(query).every(key => item[key] === query[key]);
      if (matches) {
        updated = true;
        return { ...item, ...updates };
      }
      return item;
    });
    if (updated) {
      this.write(newData);
    }
    return updated;
  }

  delete(query) {
    const data = this.read();
    const filtered = data.filter(item => {
      return !Object.keys(query).every(key => item[key] === query[key]);
    });
    this.write(filtered);
    return filtered;
  }
}

module.exports = Database;
