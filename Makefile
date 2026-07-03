HOST := mgmx@core
APP_DIR := ~/apps/cafedev-bot
INIT := export PATH="$$HOME/.bun/bin:$$PATH"

.PHONY: ssh deploy migrate logs status restart

ssh:
	ssh $(HOST)

deploy:
	ssh $(HOST) '$(INIT) && cd $(APP_DIR) && bun run deploy'

migrate:
	ssh $(HOST) '$(INIT) && cd $(APP_DIR) && bun run migrate'

logs:
	ssh $(HOST) 'journalctl -u cafedev-bot -n 100 --no-pager'

status:
	ssh $(HOST) 'systemctl status cafedev-bot --no-pager'

restart:
	ssh $(HOST) 'kill -TERM $$(systemctl show -p MainPID --value cafedev-bot)'
