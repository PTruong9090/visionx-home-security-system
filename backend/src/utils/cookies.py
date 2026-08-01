from src.config.config import env


class Cookies:
    def set_auth_cookies(response, token):
        response.set_cookie(
                key="access_token",
                value=token,
                httponly=True,
                secure=True,
                samesite="lax",
                max_age=env.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            )

    def clear_auth_cookies(response):
        response.delete_cookie("access_token")