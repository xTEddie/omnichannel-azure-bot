## Deploying to Heroku

```bash
$ heroku buildpacks:clear
$ heroku buildpacks:set https://github.com/timanovsky/subdir-heroku-buildpack
$ heroku buildpacks:add heroku/nodejs
$ heroku config:set PROJECT_PATH=nodejs/18.bot-authentication
$ heroku push heroku main
```
or

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)
