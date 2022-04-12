.PHONY: migrate-up migrate-down start dev install test
TEST_CONTAINER?=neko_bot_test_db

migrate-up:
	sql-migrate up -env=local

migrate-down:
	sql-migrate down -env=local

install:
	yarn install

start:
	yarn start

dev:
	yarn dev

test:
	@docker-compose up -d test
	@while ! docker exec $(TEST_CONTAINER) pg_isready -h localhost -p 5432 > /dev/null; do \
		sleep 1; \
	done
	sql-migrate up -config=dbconfig.yml -env="test"
	@docker cp tests/fixtures/. $(TEST_CONTAINER):/
	@docker exec -t $(TEST_CONTAINER) sh -c "chmod +x seed.sh;./seed.sh"
	yarn test
