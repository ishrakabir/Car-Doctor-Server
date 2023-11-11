
const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config()
const jwt = require('jsonwebtoken')
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

const verifyJWT = (req, res, next) => {
    console.log("Hitting JWT");
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: "unauthorized access" })
    }
    const token = authorization.split(' ')[1];
    jwt.verify(token, process.env.JWT_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(403).send({ error: true, message: "unauthorized access" })
        }
        req.decoded = decoded;
        next();
    });

}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const database = client.db("carDoctor").collection("services");
        const booking = client.db("carDoctor").collection("booking");

        app.post('/jwt', (req, res) => {
            const user = req.body;
            console.log('user', user);
            const token = jwt.sign(user, process.env.JWT_TOKEN, { expiresIn: '1h' })
            console.log('token', token);
            res.send({ token });
        })

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

        app.get('/bookings', verifyJWT, async (req, res) => {
            const decoded = req.decoded;
            console.log("decoded", req.decoded);
            if (decoded.email !== req.query.email) {
                return res.status(401).send({ error: true, message: "forbidden access" })
            }
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await booking.find(query).toArray();
            res.send(result);

        });

        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await booking.deleteOne(query);
            res.send(result)

        })

        app.patch('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const updatedBooking = req.body;
            const updateDoc = {
                $set: {
                    status: updatedBooking.status
                },
            };
            // console.log(id,filter,updatedBooking,updateDoc);
            const result = await booking.updateOne(filter, updateDoc);
            res.send(result);

        })




        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
