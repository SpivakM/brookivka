provider "aws" {
  region = "eu-north-1" # Стокгольм
}

# Мережевий екран: відкриваємо лише SSH (22) та порт твого бекенду (8082)
resource "aws_security_group" "backend_sg" {
  name        = "ar-tourist-sg"
  description = "Allow SSH and Spring Boot API"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 8082
    to_port     = 8082
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Віртуальний сервер + автоматичне встановлення Docker і Git при старті
resource "aws_instance" "app_server" {
  ami                    = "ami-021aaf3749be66813"
  instance_type          = "t3.micro"
  vpc_security_group_ids = [aws_security_group.backend_sg.id]

  user_data = <<-EOF
              #!/bin/bash
              apt-get update -y
              apt-get install -y docker.io docker-compose-v2 git
              systemctl enable --now docker
              usermod -aG docker ubuntu
              EOF

  tags = {
    Name = "ar-tourist-server"
  }
}

output "server_public_ip" {
  value = aws_instance.app_server.public_ip
}