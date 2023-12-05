FROM node

ENV PORT=3000

RUN mkdir -p /home/app

COPY . /home/app

RUN cd /home/app \
    && npm cache clean --force \
    && rm -rf node_modules package-lock.json \
    && npm install

EXPOSE 3000

WORKDIR /home/app

CMD ["npm", "start"]

