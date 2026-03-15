FROM jenkins/jenkins:lts

USER root

# Install Python 3, pip, and build essentials
RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-venv && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install pytest and requests globally
RUN pip3 install --break-system-packages pytest requests

USER jenkins
