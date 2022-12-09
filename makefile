.PHONY: start dev install init

init:
	docker-compose up -d --remove-orphans

remove-infra:
	docker-compose down

install:
	yarn install

start:
	yarn start

dev:
	yarn dev
