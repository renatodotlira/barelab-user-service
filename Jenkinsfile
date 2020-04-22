def LABEL_ID = "questcode-${UUID.randomUUID().toString()}"

podTemplate(
    label: LABEL_ID, 
    containers: [
        containerTemplate(args: 'cat', name: 'docker', command: '/bin/sh -c', image: 'docker', ttyEnabled: true),
        containerTemplate(args: 'cat', name: 'helm', command: '/bin/sh -c', image: 'lachlanevenson/k8s-helm:v2.11.0', ttyEnabled: true)
    ],
    volumes: [
      hostPathVolume(mountPath: '/var/run/docker.sock', hostPath: '/var/run/docker.sock')
    ]
)
{

    def REPOS
    def IMAGE_VERSION
    def IMAGE_POSFIX
    def KUBE_NAMESPACE
    def IMAGE_NAME          = "backend-user"
    def ENVIROMENT                     
    def GIT_BRANCH  
    def HELM_CHART_NAME     = "questcode/backend-user"      
    def HELM_DEPLOY_NAME
    def CHARTMUSEUM_URL     = "http://helm-chartmuseum:8080" 
    def NODE_PORT = 30022

    // Start
    node(LABEL_ID) {                       

        stage('Checkout') {
            echo 'Iniciando Clone do Repositório'            
            REPOS = checkout scm
            GIT_BRANCH = REPOS.GIT_BRANCH            
            echo "Branch selecionada : ${GIT_BRANCH}"
            if(GIT_BRANCH.equals("master")) {                
                KUBE_NAMESPACE = 'prod'
                ENVIROMENT = "production"
            } else if(GIT_BRANCH.equals("developer")){                
                KUBE_NAMESPACE = 'staging'
                ENVIROMENT = "staging"
                IMAGE_POSFIX = "-RC"
                NODE_PORT = 30020
            } else {
                echo "Branch selecionada: ${GIT_BRANCH}"
                def error = "Nao existe pipeline para a branch ${GIT_BRANCH}"
                echo error
                throw new Exception(error)
            }
            HELM_DEPLOY_NAME = KUBE_NAMESPACE+"-backend-user"
            IMAGE_VERSION = sh returnStdout: true, script: 'sh read-package-version.sh'
            IMAGE_VERSION = IMAGE_VERSION.trim() + IMAGE_POSFIX
        }  
        stage('Package') {
            container('docker'){
                echo 'Iniciando empacotamento com Docker'
                sh 'ls -ltra'
                withCredentials([usernamePassword(credentialsId: 'dockerhub', passwordVariable: 'DOCKER_HUB_PASSWORD', usernameVariable: 'DOCKER_HUB_USER')]) {
                    sh "docker login -u ${DOCKER_HUB_USER} -p ${DOCKER_HUB_PASSWORD}"
                    sh "docker build -t ${DOCKER_HUB_USER}/${IMAGE_NAME}:${IMAGE_VERSION} ."
                    sh "docker push ${DOCKER_HUB_USER}/${IMAGE_NAME}:${IMAGE_VERSION}"
                }                
            }                        
        }
            
        stage("Deploy") {
            container('helm'){
                echo 'Iniciando deploy com helm'
                sh 'helm init --client-only'
                sh "helm repo add questcode ${CHARTMUSEUM_URL}"                
                sh 'helm repo update'
                try {
                    //tenta fazer upgrade com HELM
                    sh "helm upgrade --namespace=${KUBE_NAMESPACE} ${HELM_DEPLOY_NAME} ${HELM_CHART_NAME} --set image.tag=${IMAGE_VERSION} --set service.nodePort=${NODE_PORT}"
                } catch (Exception e) {
                    //faz install com HELM
                    sh "helm install --namespace=${KUBE_NAMESPACE} --name ${HELM_DEPLOY_NAME} ${HELM_CHART_NAME} --set image.tag=${IMAGE_VERSION} --set service.nodePort=${NODE_PORT}"
                }
                
            }                        
        }    
    }
}