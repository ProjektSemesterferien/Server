# Server Repository for WizardWar



### config.json

To setup the server correctly, you need to create the file 'config.json' in the
root directory of the server and fill it with the following informations:

```json
{
  "database": {
    "host": "IP-ADDRESS",
	  "user": "USERNAME",
	  "password": "PASSWORD",
	  "database": "DATABASENAME"
  },
  "allowedGameServerOrigins": [
    "localhost",
    "127.0.0.1",
    "IP-ADDRESS"
  ]
}
```