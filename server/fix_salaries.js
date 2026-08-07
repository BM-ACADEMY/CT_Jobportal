const mongoose = require('mongoose');
require('dotenv').config();

const Job = require('./models/Job');

const fixSalaries = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const jobs = await Job.find({ 
            $or: [
                { 'salary.min': { $gt: 0, $lt: 1000 } },
                { 'salary.max': { $gt: 0, $lt: 1000 } }
            ]
        });

        console.log(`Found ${jobs.length} jobs with likely LPA instead of INR salaries.`);

        for (const job of jobs) {
            if (job.salary.min > 0 && job.salary.min < 1000) {
                job.salary.min = job.salary.min * 100000;
            }
            if (job.salary.max > 0 && job.salary.max < 1000) {
                job.salary.max = job.salary.max * 100000;
            }
            await job.save();
        }

        console.log('Salaries updated successfully.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

fixSalaries();
