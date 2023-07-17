// Ron Arazi, 206555674
// Shimon Turchak, 205660525
// Manor Sharabi, 203797121

// Import required modules
const express = require('express');
const mongoose = require('mongoose');

// Create Express app
const app = express();
app.use(express.json());

// Connect to MongoDB Atlas
mongoose.connect('mongodb+srv://admin:123@cluster0.oykfbgf.mongodb.net/cost_manager', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch((error) => console.error('Failed to connect to MongoDB Atlas', error));

// Define MongoDB schemas and models
const UserSchema = new mongoose.Schema({
    id: Number,
    first_name: String,
    last_name: String,
    birthday: String,
});

const CostSchema = new mongoose.Schema({
    id: Number,
    user_id: Number,
    year: Number,
    month: Number,
    day: Number,
    description: String,
    category: String,
    sum: Number,
})

const ReportSchema = new mongoose.Schema({
    user_id: Number,
    year: Number,
    month: Number,
    reportData: {
        food: [],
        health: [],
        housing: [],
        sport: [],
        education: [],
        transportation: [],
        other: [],
    },
});

const Report = mongoose.model('Report', ReportSchema);
const User = mongoose.model('User', UserSchema);
const Cost = mongoose.model('Cost', CostSchema);

app.post('/addcost', async (req, res) => {
    const { user_id, year, month, day, description, category, sum } = req.body;
    
    // Check if the date is valid
    if (!isValidDate(year, month, day)) {
        return res.status(400).json({ error: 'Invalid date' });
    }

    // Check if the sum is negative
    if (sum < 0) {
        return res.status(400).json({ error: 'Sum cannot be negative' });
    }

    // Check if the category is a valid category
    const validCategories = ['food', 'health', 'housing', 'sport', 'education', 'transportation', 'other'];

    if (!validCategories.includes(category)) {
      return res.json({ error: 'Invalid category' });
    }

    try {
        // Find the maximum id in the Cost collection
        const cost = await Cost.findOne().sort({ id: -1 }).exec();
        const id = cost ? cost.id + 1 : 1; // Increment the maximum id or set to 1 if no existing costs

        // Create a new cost item
        const newCost = new Cost({
            id,
            user_id,
            year,
            month,
            day,
            description,
            category,
            sum,
        });

        // Save the new cost item to the database
        const savedCost = await newCost.save();

        // Find the relevant report based on user_id, year, and month
        let report = await Report.findOne({ user_id, year, month });

        if (!report) {
            // Create a new report if it doesn't exist
            report = new Report({
                user_id,
                year,
                month,
                reportData: {
                    food: [],
                    health: [],
                    housing: [],
                    sport: [],
                    education: [],
                    transportation: [],
                    other: [],
                },
            });
        }

        // Categorize the new cost item
        report.reportData[category].push(savedCost);

        // Save the updated report
        await report.save();

        res.json(savedCost.toObject()); // Convert to plain JavaScript object
    } catch (error) {
        res.status(500).json({ error: 'Failed to add the cost item.' });
    }
});


app.get('/report', (req, res) => {
    const { user_id, year, month } = req.query;

    // Check if the user_id exists in the users database
    User.findOne({ id: user_id })
        .then((user) => {
            if (user) {
                // User exists, proceed with fetching the report
                Report.findOne({ user_id, year, month })
                    .then((report) => {
                        if (report) {
                            res.json(report.reportData);
                        } else {
                            res.json({
                                food: [],
                                health: [],
                                housing: [],
                                sport: [],
                                education: [],
                                transportation: [],
                                other: [],
                            });
                        }
                    })
                    .catch((error) => {
                        res.status(500).json({ error: 'Failed to get the cost report.' });
                    });
            } else {
                // User does not exist
                res.status(404).json({ error: 'User not found.' });
            }
        })
        .catch((error) => {
            res.status(500).json({ error: 'Failed to check user existence.' });
        });
});

app.get('/about', (req, res) => {
    // Get information about the developers
    const developers = [
        {
            firstname: 'Ron',
            lastname: 'Arazi',
            id: 206555674,
            email: 'ronarazi5@gmail.com',
        },
        {
            firstname: 'Shimon',
            lastname: 'Turchak',
            id: 205660525,
            email: 'shimonturchak@yahoo.com',
        },
        {
            firstname: 'Manor',
            lastname: 'Sharabi',
            id: 203797121,
            email: 'sharabimanor@gmail.com',
        }
    ];

    res.json(developers);
});


// Function to validate the date
function isValidDate(year, month, day) {
    const date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === Number(year) &&
      date.getMonth() === Number(month) - 1 &&
      date.getDate() === Number(day)
    );
  }


// Start the server
const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
