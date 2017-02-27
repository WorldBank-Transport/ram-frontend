#!/bin/bash
set -e

echo "Building source image"
docker build -t $DOCKER_SRC_IMAGE .

docker login -u="$DOCKER_USERNAME" -p="$DOCKER_PASSWORD"

echo "Pushing image to Docker Hub:$TRAVIS_COMMIT"
docker tag $DOCKER_SRC_IMAGE $DOCKER_REPOSITORY:$TRAVIS_COMMIT
docker push $DOCKER_REPOSITORY:$TRAVIS_COMMIT
echo "Also pushing as :latest"
docker tag $DOCKER_SRC_IMAGE $DOCKER_REPOSITORY:latest
docker push $DOCKER_REPOSITORY:latest

echo "Installing ecs-cli"
sudo curl -o /usr/local/bin/ecs-cli https://s3.amazonaws.com/amazon-ecs-cli/ecs-cli-linux-amd64-latest
sudo chmod +x /usr/local/bin/ecs-cli

echo "Building ECS task"
npm install yamljs
node .build_scripts/insert-env.js
cat docker-compose-generated.yml

echo "Configuring ECS client"
ecs-cli configure --region $AWS_REGION --access-key $AWS_ACCESS_KEY_ID --secret-key $AWS_SECRET_ACCESS_KEY --cluster $AWS_ECS_CLUSTER

echo "Stopping current ECS task"
ecs-cli compose --verbose --file docker-compose-generated.yml service stop

echo "Deploying to ECS"
ecs-cli compose --verbose --file docker-compose-generated.yml service up