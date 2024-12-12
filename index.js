const express=require('express')
const jwt=require('jsonwebtoken')
const db=require('./db')
const bcrypt=require('bcrypt')
const cors=require('cors')
const cookie_parser=require('cookie-parser')
const salt=10;

const app=express();
app.use(express.json())
const corsOptions = {
    origin: ['http://localhost:3000','http://localhost:3000/Home','http://localhost:3000/register'],
    credentials:true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.use(cookie_parser())

app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', "default-src 'self'; connect-src 'self' http://localhost:3001; script-src 'self'; style-src 'self';");
    next();
});


app.get('/db',async (req,res)=>{
    try {
        const result=await db.query("CREATE TABLE user_auth (username varchar primary key,usermail varchar,password varchar);")
        if(result){
           res.status(200).json({
            status:"success"
        })
        console.log("Table Created Successfully")
        }
    } catch (error) {
        res.status(401).json({
            message:"Failed to create a Table"
        })
    }
})

app.post("/login",async(req,res)=>{
    // console.log("Login Iniiated")
    if(!req.body.usermail || !req.body.password) return res.status(401).json({status:"Missing Paramerts"})
    const q=`SELECT * FROM USER_AUTH WHERE usermail=$1`;
    try{
        const data=await db.query(q,[req.body.usermail])
        if (data.rowCount>0){
          bcrypt.compare(req.body.password.toString(),data.rows[0].password,(err,result)=>{
            if(err) return res.status(401).json({message:"Password compare Error"})
            if(result){
                const name=data.rows[0].username
                const token=jwt.sign({name},"vaiv-varsh",{expiresIn:"1d"})
                res.cookie('token', token, {
                    //    httpOnly: true,
                       sameSite: 'Strict',
                    maxAge: 60 * 60 * 1000  });
                // console.log(token)
               return res.status(200).json({
                status:"success"
               })
            }
            else{
                return res.status(401).json({
                    status:"Invlaid password"
                })
            }
          })
          }
        else{
            return res.status(401).json({
                status:"No user Exists"
            })
        }

        }
    catch(err){
        return res.status(401).json({
            Error:err
        })
}
})

app.get('/logout',(req,res)=>{
   res.clearCookie('token',{ path:'/' })
   res.status(200).json({
    status:"success",
    message:"Token cookie cleared"
   })
})


app.get("/check-token",(req,res)=>{
    // console.log("checking Cookie")
try{
    const token=req.cookies?.token;
// console.log(token)
 if(!token) return null
 jwt.verify(token,"vaiv-varsh",(err,data)=>{
    // console.log("JWT verfiying...")
    if(err) return res.status(401)
    return res.status(201).json({
       status:"success",
       username:data.name
    })
 })
}
catch(err){
    return res.status(401).json({
        Error:"Failed to Check Token"
    })
}
})
app.post('/register',async (req,res)=>{
    try{
        if(!req.body.usermail || !req.body.usermail || !req.body.password){
            return res.status(401).json({
                message:"Missing values from user"
            })
        }
        const q = 'INSERT INTO USER_AUTH(username,usermail,password) VALUES($1,$2,$3);';    
        bcrypt.hash(req.body.password.toString(),salt,async (err,hash)=>{
            if(err) return res.status(401).json({Error:"Failed Hashing"})
            try{
             const result=await db.query(q,[req.body.username,req.body.usermail,hash])
             return res.status(200).json({
                status:"succcess"
             })
            }
            catch(err){
            return res.status(401).json({
            Error:err.detail
            })
           }
            })
    }
    catch(error){
       return res.status(401).json({
        success:"failed"
       })
    }
})
app.listen(3001,()=>{
    console.log("Server listening on PORT 3001")
})