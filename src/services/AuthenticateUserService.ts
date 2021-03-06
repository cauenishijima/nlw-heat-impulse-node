
import axios from 'axios';
import prismaClient from '../prisma';
import { sign } from 'jsonwebtoken'
/**
 *  Receber code(string)
 *  Recuperar o access_token no github
 *  Recuperar informações do usuário no github
 *  Verificar se o usuário existe no BD
 *  ---- SIM = Gera um token
 *  ---- NAO = Cria no BD e gera um token
 *  Retorna o token com as informações do usuário
 */

interface IAccessTokenResponse {
  access_token: string;
}

interface IUserResponse {
  avatar_url: string;
  login: string;
  id: number;
  name: string;
}

class AuthenticateUserService {

  async execute(code: string) {
    const url = 'https://github.com/login/oauth/access_token';

    const { data: { access_token } } = await axios.post<IAccessTokenResponse>(url, null, {
      params: {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code
      },
      headers: {
        "Accept": "application/json"
      }
    });

    const { data: { login, avatar_url, id, name } } = await axios.get<IUserResponse>('http://api.github.com/user', {
      headers: {
        authorization: `Bearer ${access_token}`
      }
    })

    let user = await prismaClient.user.findFirst({
      where: {
        github_id: id
      }
    })

    if (!user) {
      user = await prismaClient.user.create({
        data: {
          github_id: id,
          login,
          avatar_url,
          name
        }
      })
    }

    const token = sign({
      user: {
        name: user.name,
        avatar_url: user.avatar_url,
        id: user.id
      }
    }, process.env.APP_JWT_SECRET, {
      subject: user.id,
      expiresIn: '1d'
    })
    return { token, user };
  }

}

export { AuthenticateUserService }