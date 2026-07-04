const Counter = require('../models/Counter');

const generateDisplayId = async (entityPrefix, year) => {
  const yy = year.toString().slice(-2);
  const doc = await Counter.findOneAndUpdate(
    { entity: entityPrefix, year: year },
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true }
  );
  const sequence = doc.seq.toString().padStart(5, '0');
  return `${entityPrefix}${yy}-${sequence}`;
};

module.exports = generateDisplayId;
