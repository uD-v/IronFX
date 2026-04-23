from user.models import Users

def nightly_sync():
  all_users = Users.objects.filter(limit__lt=20)
  for user in all_users:
    user.limit = 20
    user.save()