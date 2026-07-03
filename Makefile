HOST := mgmx@core
APP_DIR := ~/apps/cafedev-bot
INIT := export PATH="$$HOME/.bun/bin:$$PATH"

.PHONY: deploy migrate restart

deploy:
	ssh $(HOST) '$(INIT) && cd $(APP_DIR) && bun run deploy'

migrate:
	ssh $(HOST) '$(INIT) && cd $(APP_DIR) && bun run migrate'

restart:
	ssh $(HOST) 'kill -TERM $$(systemctl show -p MainPID --value cafedev-bot)'
