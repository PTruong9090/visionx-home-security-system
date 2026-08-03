from src.config.config import env


def set_auth_cookies(response, token):
    response.set_cookie(
            key="access_token",
            value=token,
            path='/',
            domain=env.COOKIE_DOMAIN,
            httponly=True,
            secure=env.COOKIE_SECURE,
            samesite=env.COOKIE_SAMESITE,
            max_age=env.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

def clear_auth_cookies(response):
    response.delete_cookie(
            key="access_token",
            path='/',
            domain=env.COOKIE_DOMAIN,
            httponly=True,
            secure=env.COOKIE_SECURE,
            samesite=env.COOKIE_SAMESITE,
        )