import User from "../models/user.model.js"

export const index = async (req, res) => {
    const users = await User.findAll({
        raw: true
    });
    console.log(users);
    res.send("ok");
}