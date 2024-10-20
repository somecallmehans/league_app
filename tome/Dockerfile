FROM python:3.9-slim

RUN apt-get update && apt-get install -y libpq-dev gcc


EXPOSE 8000

ENV PYTHONDONTWRITEBYTECODE=1

ENV PYTHONUNBUFFERED=1

COPY requirements.txt requirements.txt
RUN pip install --upgrade pip && pip install -r requirements.txt

WORKDIR /app
COPY . .

RUN adduser -u 5678 --disabled-password --gecos "" appuser && chown -R appuser /app
USER appuser

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "tome.wsgi"]
