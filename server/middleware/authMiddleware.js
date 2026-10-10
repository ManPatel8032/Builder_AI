import jwt from "jsonwebtoken";

export function authMiddleware(req, res, next){
    const token = req.cookies?.token;
    if(!token){
        return res.status(401).json({
            error: "Access Denied. No session token provided"
        });
    }

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        req.user = decoded;
        next();
    }catch(err){
        return res.status(403).json({error: "Invalid Session Token or Expired"});
    }
}