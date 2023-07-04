all: build-js test-programs test-js
install: js
build: build-js
test: test-js
generate-docs: build-docs
release: release-js


js:
	cd sdks && yarn install && cd ../

build-js:
	cd sdks && yarn build && cd ../

publish-js:
	cd sdks && yarn changesets publish && cd ../

build-docs:
	cd sdks && yarn run typedoc --excludeInternal && cd ../

release-js:
	cd sdks && \
	 yarn test && \
	 yarn changeset && \
	 yarn changeset version && \
	 cd ../ && \
	 git add . && \
	 git commit -m "chore(release): version packages" && \
	 cd sdks && \
	 yarn build && \
	 yarn changeset publish && \
	 yarn docs:generate && \
	 cd ../

test-programs:
	anchor test

test-js:
	cd sdks && yarn test && cd ../
