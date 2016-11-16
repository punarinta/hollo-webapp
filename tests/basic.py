# https://christopher.su/2015/selenium-chromedriver-ubuntu/

import re
import config
from time import sleep
from selenium import webdriver

def log(text, status):
	if status == True:
		print '\033[92m[PASSED]\033[0m ' + text
	else:
		print '\033[91m[FAILED]\033[0m ' + text

# remember to input your own file path to your chrome driver here if you're using chrome
browser = webdriver.Chrome()
browser.set_window_size(414, 736)	# 375 x 667

rootURL = 'https://app.hollo.dev'
browser.get(rootURL)

username = browser.find_element_by_xpath("//input[@type='email']")
password = browser.find_element_by_xpath("//input[@type='password']")
username.send_keys(config.username)
password.send_keys(config.password)

login_button = browser.find_element_by_xpath('//button[@class="login"]')
login_button.click()
sleep(4.0)
log('Path changed to /chats', browser.current_url == rootURL + '/chats')

profile_button = browser.find_element_by_xpath('//chats-page/bottom-bar/bar-icon[1]')
profile_button.click()
sleep(2.0)
log('Path changed to /profile', browser.current_url == rootURL + '/profile')

sleep(0.5)
print ''
# browser.quit()
