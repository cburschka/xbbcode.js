BABEL=babel

xbbcode.js: src/xbbcode.js
	$(BABEL) $^ -o $@
