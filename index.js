
const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

//middleware    
app.use(cors());
app.use(express.json());



console.log(process.env.DB_PASS);
const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@ishrak.xqme42m.mongodb.net/?retryWrites=true&w=majority`;


const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const database = client.db("carDoctor").collection("services");
        const booking = client.db("carDoctor").collection("booking");

        app.get('/services', async (req, res) => {
            const cursor = database.find();
            const services = await cursor.toArray();
            res.send(services);
        }
        )
        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;

            // Ensure id is a valid ObjectId or convert it if necessary
            let objectId;
            try {
                objectId = new ObjectId(id);
            } catch (error) {

                return res.status(400).json({ error: 'Invalid ID' });
            }

            const query = { _id: objectId };
            const options = {
                projection: {
                    description: 0,
                    facility: 0
                }
            };

            const service = await database.findOne(query, options);
            if (!service) {
                return res.status(404).json({ error: 'Service not found' });
            }

            res.send(service);
        });

        app.post('/bookings', async (req, res) => {
            const service = req.body;
            const result = await booking.insertOne(service);
            res.send(result);
        })

        app.get('/bookings', async (req, res) => {
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            console.log(query);
            const result = await booking.find(query).toArray();
            res.send(result);

        });



        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
