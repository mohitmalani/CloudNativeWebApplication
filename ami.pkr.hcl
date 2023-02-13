packer {
    required_version = ">=1.7.3"

    required_plugins {
        vsphere = {
          version = ">= 0.0.1"
          source = "github.com/hashicorp/vsphere"
        }
    }
}

variable "aws_access_key" {
  type    = string
  default = "${env("aws-access-key-id")}"
}

variable "aws_region" {
  type    = string
  default = "${env("aws-region")}"
}

variable "aws_secret_key" {
  type    = string
  default = "${env("aaws-secret-access-key")}"
}

variable "source_ami" {
  type    = string
  default = ""
}

variable "ssh_username" {
  type    = string
  default = ""
}

variable "subnet_id" {
  type    = string
  default = ""
}

variable "vpc_id" {
  type    = string
  default = ""
}

variable "file_name" {
  type    = string
  default = ""
}

variable "file_destination_name" {
  type    = string
  default = ""
}

variable "aws_acct_list" {
  type    = list(string)
  default = []
}

variable "zip_file" {
  type    = string
  default = ""
}

locals { timestamp = regex_replace(timestamp(), "[- TZ:]", "") }

source "amazon-ebs" "autogenerated_1" {
  access_key    = "${var.aws_access_key}"
  ami_name      = "csye6225_Fall2022_${local.timestamp}"
  instance_type = "t2.micro"
  region        = "${var.aws_region}"
  secret_key    = "${var.aws_secret_key}"
  source_ami    = "${var.source_ami}"
  ssh_username  = "${var.ssh_username}"
  subnet_id     = "${var.subnet_id}"
  vpc_id     = "${var.vpc_id}"
  ami_users = "${var.aws_acct_list}"
}
build {
  sources = ["source.amazon-ebs.autogenerated_1"]

  provisioner "file" {
    source = "${var.zip_file}"
  // source = "/Users/mohitmalani/Documents/GitHub/Temp.zip"
    destination = "/home/ubuntu/webservice1.zip"
  }

  // provisioner "shell" {
  //   script="./shell/postgresql.sh"
  // }

  provisioner "shell" {
    script="./shell/node.sh"
  }
}