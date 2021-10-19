import { Request, Response } from "express";
import { ProfileUserService } from "../services/ProfileUserService";

class ProfileUserControlle {
  async handle(request: Request, response: Response) {
    const { user_id } = request;

    const profileUser = new ProfileUserService();

    const user = await profileUser.execute(user_id);

    return response.json(user);
  }
}

export { ProfileUserControlle }